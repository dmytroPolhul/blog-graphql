import { Injectable } from '@nestjs/common';
import { BaseService } from '../baseModule/base.service';
import { BlogPost } from './entities/blog-post.entity';
import { BlogPostRepository } from './repositories/blogPost.repository';
import { CreateBlogPostInput } from './dto/create-blog-post.input';
import { BlogService } from '../blog/blog.service';
import { UpdateBlogPostInput } from './dto/update-blog-post.input';
import { Blog } from '../blog/entities/blog.entity';
import { BlogPostFilteringPaginationSorting } from './types/filteringPaginationSorting.input';
import { BlogPostsResponse } from './dto/responses/blogPost.response';
import { Any, ILike } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../../common/enums/userRole.enum';
import { ForbiddenError } from '@nestjs/apollo';

@Injectable()
export class BlogPostService extends BaseService<BlogPost> {
  constructor(
    private blogService: BlogService,
    private blogPostRepository: BlogPostRepository,
  ) {
    super(blogPostRepository);
  }

  async createPost(request: CreateBlogPostInput): Promise<BlogPost> {
    const blog = await this.blogService.getBlog(request.blogId);
    return this.blogPostRepository.create({ ...request, blog });
  }

  async updatePost(
    user: User,
    request: UpdateBlogPostInput,
  ): Promise<BlogPost> {
    const post = await this.blogPostRepository.findOne({
      where: { id: request.id },
      relations: ['blog'],
    });

    if (user.role !== Role.MODERATOR && post.blog.author.id !== user.id) {
      throw new ForbiddenError('You can only update your own blog posts.');
    }

    await this.blogPostRepository.update({ ...post, ...request });
    return this.getPost(post.id);
  }

  async getPost(id: string): Promise<BlogPost> {
    return this.blogPostRepository.findOneOrFail({
      where: { id },
      relations: ['blog'],
    });
  }

  async getPosts(
    request?: BlogPostFilteringPaginationSorting,
  ): Promise<BlogPostsResponse> {
    const whereOptions = {
      where: {
        id: request?.filter?.blogPostId,
        isPublish: request?.filter?.isPublish
          ? request?.filter?.isPublish
          : undefined,
        tags: undefined,
        title: request?.filter?.title
          ? ILike(`%${request?.filter?.title}%`)
          : undefined,
      },
      skip: request?.pagination?.offset,
      take: request?.pagination?.limit,
      order: {
        [request?.sorting?.field]: request?.sorting?.order,
      },
    };

    if (request?.filter?.tag) {
      whereOptions.where.tags = Any([request?.filter?.tag]);
    }

    const [results, total] = await this.blogPostRepository.findAndCount({
      ...whereOptions,
    });

    return {
      results,
      options: {
        pagination: request?.pagination,
        sorting: request?.sorting,
        filter: request?.filter,
      },
      total,
    };
  }

  async deletePost(user: User, id: string): Promise<boolean> {
    const post = await this.getPost(id);
    if (user.role !== Role.MODERATOR && post.blog.author.id !== user.id) {
      throw new ForbiddenError('You can only delete your own blog posts.');
    }
    const affectedPost = await this.blogPostRepository.hardDelete({ id });
    return !!affectedPost;
  }

  async getMainBlog(id: string): Promise<Blog> {
    return this.blogService.getBlog(id);
  }
}

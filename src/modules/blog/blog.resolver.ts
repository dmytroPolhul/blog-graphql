import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { BlogService } from './blog.service';
import { Blog } from './entities/blog.entity';
import { CreateBlogInput } from './dto/requests/create-blog.input';
import { UpdateBlogInput } from './dto/requests/update-blog.input';
import { User } from '../user/entities/user.entity';
import { BlogsResponse } from './dto/responses/blog.response';
import { FilteringPaginationSorting } from './types/filteringPaginationSorting.input';
import { AuthPermission } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/enums/userRole.enum';

@Resolver(() => Blog)
export class BlogResolver {
  constructor(private blogService: BlogService) {}

  @Mutation(() => Blog)
  @AuthPermission(Role.WRITER)
  createBlog(@Args('createBlogInput') request: CreateBlogInput): Promise<Blog> {
    return this.blogService.createBlog(request);
  }

  @Mutation(() => Blog)
  @AuthPermission()
  updateBlog(
    @Args('updateBlogInput') request: UpdateBlogInput,
    @Context() context,
  ): Promise<Blog> {
    const user = context.req.user;
    return this.blogService.updateBlog(user, request);
  }

  @Mutation(() => Boolean)
  @AuthPermission()
  deleteBlog(@Args('id') id: string, @Context() context): Promise<boolean> {
    const user = context.req.user;
    return this.blogService.deleteBlog(user, id);
  }

  @Query(() => Blog)
  getBlogById(@Args('id', { type: () => String }) id: string): Promise<Blog> {
    return this.blogService.getBlog(id);
  }

  @Query(() => BlogsResponse)
  blogs(
    @Args('filter', { nullable: true }) filter?: FilteringPaginationSorting,
  ): Promise<BlogsResponse> {
    return this.blogService.getBlogs(filter);
  }

  @Query(() => [Blog])
  async getBlogPosts(
    @Args('id', { type: () => String }) id: string,
  ): Promise<Blog[]> {
    return this.blogService.findRelatedPosts(id);
  }

  @ResolveField(() => User)
  author(@Parent() blog: Blog): Promise<User> {
    return this.blogService.getAuthor(blog.author.id);
  }
}

/**
 * Thin controller layer — business logic lives in api::lms.lms service.
 */
export default ({ strapi }: { strapi: any }) => ({
  async me(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').me(ctx);
  },
  async enroll(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').enroll(ctx);
  },
  async myCourses(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').myCourses(ctx);
  },
  async completeLesson(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').completeLesson(ctx);
  },
  async courseProgress(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').courseProgress(ctx);
  },
  async takeQuiz(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').takeQuiz(ctx);
  },
  async submitQuiz(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').submitQuiz(ctx);
  },
  async quizAttempts(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').quizAttempts(ctx);
  },
  async studentDashboard(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').studentDashboard(ctx);
  },
  async instructorDashboard(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').instructorDashboard(ctx);
  },
  async contentManagerDashboard(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').contentManagerDashboard(ctx);
  },
  async adminDashboard(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminDashboard(ctx);
  },
  async adminListUsers(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminListUsers(ctx);
  },
  async adminUpdateUserRole(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminUpdateUserRole(ctx);
  },
  async adminUpdateUserStatus(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminUpdateUserStatus(ctx);
  },
  async getCoursePlayer(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').getCoursePlayer(ctx);
  },
  async listCatalog(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCatalog(ctx);
  },
  async getCatalogCourse(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').getCatalogCourse(ctx);
  },
  async createCourse(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createCourse(ctx);
  },
  async updateCourse(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').updateCourse(ctx);
  },
  async deleteCourse(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').deleteCourse(ctx);
  },
  async createLesson(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createLesson(ctx);
  },
  async updateLesson(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').updateLesson(ctx);
  },
  async deleteLesson(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').deleteLesson(ctx);
  },
  async createQuiz(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createQuiz(ctx);
  },
  async updateQuiz(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').updateQuiz(ctx);
  },
  async deleteQuiz(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').deleteQuiz(ctx);
  },
  async listBlog(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listBlog(ctx);
  },
  async getBlogBySlug(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').getBlogBySlug(ctx);
  },
  async manageBlog(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').manageBlog(ctx);
  },
  async createBlog(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createBlog(ctx);
  },
  async updateBlog(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').updateBlog(ctx);
  },
  async deleteBlog(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').deleteBlog(ctx);
  },
});

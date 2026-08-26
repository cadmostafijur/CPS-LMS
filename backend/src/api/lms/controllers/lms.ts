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
  async adminCreateUser(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCreateUser(ctx);
  },
  async adminDeleteUser(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminDeleteUser(ctx);
  },
  async myCertificates(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').myCertificates(ctx);
  },
  async getCertificate(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').getCertificate(ctx);
  },
  async adminListCertificates(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminListCertificates(ctx);
  },
  async adminListEnrollments(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminListEnrollments(ctx);
  },
  async listBanners(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listBanners(ctx);
  },
  async adminListBanners(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminListBanners(ctx);
  },
  async adminCreateBanner(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCreateBanner(ctx);
  },
  async adminUpdateBanner(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminUpdateBanner(ctx);
  },
  async adminDeleteBanner(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminDeleteBanner(ctx);
  },
  async adminListCoupons(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminListCoupons(ctx);
  },
  async adminCreateCoupon(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCreateCoupon(ctx);
  },
  async adminUpdateCoupon(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminUpdateCoupon(ctx);
  },
  async adminDeleteCoupon(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminDeleteCoupon(ctx);
  },
  async validateCoupon(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').validateCoupon(ctx);
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
  async listCategories(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCategories(ctx);
  },
  async adminListCategories(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminListCategories(ctx);
  },
  async adminCreateCategory(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCreateCategory(ctx);
  },
  async adminUpdateCategory(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminUpdateCategory(ctx);
  },
  async adminDeleteCategory(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminDeleteCategory(ctx);
  },
  async listCourseModules(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCourseModules(ctx);
  },
  async createCourseModule(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createCourseModule(ctx);
  },
  async updateCourseModule(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').updateCourseModule(ctx);
  },
  async deleteCourseModule(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').deleteCourseModule(ctx);
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

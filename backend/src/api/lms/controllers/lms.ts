/**
 * Thin controller layer — business logic lives in api::lms.lms service.
 */
export default ({ strapi }: { strapi: any }) => ({
  async me(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').me(ctx);
  },
  async updateMe(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').updateMe(ctx);
  },
  async changeMyPassword(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').changeMyPassword(ctx);
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
  async staffListCourses(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').staffListCourses(ctx);
  },
  async staffListProgress(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').staffListProgress(ctx);
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
  async adminListByRole(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminListByRole(ctx);
  },
  async adminForceEnroll(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminForceEnroll(ctx);
  },
  async adminRemoveEnrollment(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminRemoveEnrollment(ctx);
  },
  async adminCrudList(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCrudList(ctx);
  },
  async adminCrudCreate(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCrudCreate(ctx);
  },
  async adminCrudUpdate(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCrudUpdate(ctx);
  },
  async adminCrudDelete(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminCrudDelete(ctx);
  },
  async adminStockAdjust(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminStockAdjust(ctx);
  },
  async adminRevokeCertificate(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminRevokeCertificate(ctx);
  },
  async verifyCertificate(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').verifyCertificate(ctx);
  },
  async createOrderCheckout(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createOrderCheckout(ctx);
  },
  async payOrder(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').payOrder(ctx);
  },
  async listMyNotifications(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listMyNotifications(ctx);
  },
  async markNotificationRead(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').markNotificationRead(ctx);
  },
  async markAllNotificationsRead(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').markAllNotificationsRead(ctx);
  },
  async listAnnouncements(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listAnnouncements(ctx);
  },
  async adminGlobalSearch(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminGlobalSearch(ctx);
  },
  async adminReportsSummary(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminReportsSummary(ctx);
  },
  async adminGetSettings(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminGetSettings(ctx);
  },
  async adminSaveSettings(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').adminSaveSettings(ctx);
  },
  async listMyAssignments(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listMyAssignments(ctx);
  },
  async submitAssignment(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').submitAssignment(ctx);
  },
  async staffListAssignments(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').staffListAssignments(ctx);
  },
  async staffCreateAssignment(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').staffCreateAssignment(ctx);
  },
  async staffListSubmissions(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').staffListSubmissions(ctx);
  },
  async staffGradeSubmission(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').staffGradeSubmission(ctx);
  },
  async listCourseDiscussions(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCourseDiscussions(ctx);
  },
  async createCourseDiscussion(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createCourseDiscussion(ctx);
  },
  async replyCourseDiscussion(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').replyCourseDiscussion(ctx);
  },
  async listCourseReviews(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCourseReviews(ctx);
  },
  async submitCourseReview(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').submitCourseReview(ctx);
  },
  async listCourseAnnouncements(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCourseAnnouncements(ctx);
  },
  async createCourseAnnouncement(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createCourseAnnouncement(ctx);
  },
  async listCourseQuestionBank(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCourseQuestionBank(ctx);
  },
  async importQuestionBankToQuiz(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').importQuestionBankToQuiz(ctx);
  },
  async listCourseLiveSessions(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listCourseLiveSessions(ctx);
  },
  async createCourseLiveSession(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createCourseLiveSession(ctx);
  },
  async listMyTickets(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listMyTickets(ctx);
  },
  async createMyTicket(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createMyTicket(ctx);
  },
  async listMyWishlist(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listMyWishlist(ctx);
  },
  async addWishlist(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').addWishlist(ctx);
  },
  async removeWishlist(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').removeWishlist(ctx);
  },
  async instructorCourseAnalytics(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').instructorCourseAnalytics(ctx);
  },
  async listMyMessages(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listMyMessages(ctx);
  },
  async sendMessage(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').sendMessage(ctx);
  },
  async markLiveAttendance(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').markLiveAttendance(ctx);
  },
  async runWishlistReminders(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').runWishlistReminders(ctx);
  },
  async studentTranscript(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').studentTranscript(ctx);
  },
  async exportCourseGradesCsv(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').exportCourseGradesCsv(ctx);
  },
  async cloneCourse(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').cloneCourse(ctx);
  },
  async listMyLiveCalendar(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listMyLiveCalendar(ctx);
  },
  async listHelpDeskPosts(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').listHelpDeskPosts(ctx);
  },
  async createHelpDeskPost(ctx: any) {
    ctx.body = await strapi.service('api::lms.lms').createHelpDeskPost(ctx);
  },
});

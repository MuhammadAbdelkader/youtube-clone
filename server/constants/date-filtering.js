const dateConstants = {
    UploadedToday: new Date(new Date().setHours(0, 0, 0, 0)),
    ThisWeek: new Date(new Date().setDate(new Date().getDate() - 7)),
    ThisMonth: new Date(new Date().setDate(1)),
    ThisYear: new Date(new Date().setMonth(0, 1))
};
module.exports = dateConstants;

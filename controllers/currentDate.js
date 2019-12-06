const callDate = {
  currentDate: () => {
    const dt = new Date();
    const utcDate = dt.toUTCString();
    return utcDate;
  },
};

module.exports = callDate;

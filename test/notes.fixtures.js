function makeNotesArray() {
  return [
    {
      id: 2,
      title: "test",
      content: "bla bla bla",
      date_created: "2021-02-04T20:39:05.000Z",
      folder_id: 1,
    },
    {
      id: 3,
      title: "test",
      content: "bla bla bla",
      date_created: "2021-02-04T20:48:49.000Z",
      folder_id: 1,
    },
    {
      id: 4,
      title: "test",
      content: "bla bla bla",
      date_created: "2021-02-04T20:48:50.000Z",
      folder_id: 3,
    },
  ];
}

module.exports = {
  makeNotesArray,
};

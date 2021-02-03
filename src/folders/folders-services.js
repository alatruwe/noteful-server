const FoldersService = {
  getAllFolders(knex) {
    return knex.select("*").from("noteful-folders");
  },

  insertFolder(knex, newFolder) {
    return knex
      .insert(newFolder)
      .into("noteful-folders")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from("noteful-folders").select("*").where("id", id).first();
  },
};

module.exports = FoldersService;

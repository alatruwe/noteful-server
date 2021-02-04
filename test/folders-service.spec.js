const FoldersService = require("../src/folders/folders-services");
const knex = require("knex");
const { expect } = require("chai");
const app = require("../src/app");
const { makeFoldersArray } = require("./folders.fixtures");

describe(`Folders service object`, function () {
  let db;

  // connect to database
  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    // tests skip server.js so we need the instance here
    app.set("db", db);
  });

  // disconnect to database
  after("disconnect from db", () => db.destroy());

  // clean the data
  before("clean the table", () => db("noteful_folders").truncate());

  // remove any table data so that each test has a clean start
  afterEach("cleanup", () => db("noteful_folders").truncate());

  before("clean the table", () => db("noteful_folders").truncate());

  afterEach("cleanup", () => db("noteful_folders").truncate());

  describe(`GET /api/folders`, () => {
    //test when database is empty
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/folders").expect(200, []);
      });
    });

    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it("responds with 200 and all of the folders", () => {
        return supertest(app).get("/api/folders").expect(200, testFolders);
      });
    });
  });

  describe(`GET /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 123456;
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder doesn't exist` } });
      });
    });

    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it("responds with 200 and the specified folder", () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });
  });

  describe(`POST /api/folders`, () => {
    it(`creates an folder, responding with 201 and the new folder`, function () {
      const newFolder = {
        folder_name: "Test new folder",
      };
      return supertest(app)
        .post("/api/folders")
        .send(newFolder)
        .expect(201)
        .expect((res) => {
          expect(res.body.folder_name).to.eql(newFolder.folder_name);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/folders/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    // test the body, see if required data is missing
    const requiredFields = ["folder_name"];

    requiredFields.forEach((field) => {
      const newFolder = {
        folder_name: "Test new folder",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newFolder[field];

        return supertest(app)
          .post("/api/folders")
          .send(newFolder)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });
});

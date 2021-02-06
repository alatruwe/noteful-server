const knex = require("knex");
const { expect } = require("chai");
const app = require("../src/app");
const { makeFoldersArray } = require("./folders.fixtures");
const { makeNotesArray } = require("./notes.fixtures");

describe(`Notes service object`, function () {
  let db;

  // connect to database
  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    // tests skip server.js so we need the instance here
    app.set("db", db);
  });

  // disconnect to database
  after("disconnect from db", () => db.destroy());

  // clean the data
  before("clean the table", () =>
    db.raw("TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE")
  );

  // remove any table data so that each test has a clean start
  afterEach("cleanup", () =>
    db.raw("TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE")
  );

  describe(`GET /api/notes`, () => {
    //test when database is empty
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/notes").expect(200, []);
      });
    });

    context("Given there are notes in the database", () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it("responds with 200 and all of the notes", () => {
        return supertest(app).get("/api/notes").expect(200, testNotes);
      });
    });
  });

  describe(`GET /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456;
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note doesn't exist` } });
      });
    });

    context("Given there are notes in the database", () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it.skip("responds with 200 and the specified note", () => {
        const noteId = 3;
        const expectedNote = testNotes[noteId - 1];
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, expectedNote);
      });
    });
  });

  describe.skip(`POST /api/notes`, () => {
    it(`creates a note, responding with 201 and the new note`, function () {
      const newNote = {
        title: "test",
        content: "bla bla bla",
        folder_id: 1,
      };
      return supertest(app)
        .post("/api/notes")
        .send(newNote)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newNote.title);
          expect(res.body.content).to.eql(newNote.content);
          expect(res.body.folder_id).to.eql(newNote.folder_id);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
          const expected = new Intl.DateTimeFormat("en-US").format(new Date());
          const actual = new Intl.DateTimeFormat("en-US").format(
            new Date(res.body.date_created)
          );
          expect(actual).to.eql(expected);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/notes/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    // test the body, see if required data is missing
    const requiredFields = ["title", "content", "folder_id"];

    requiredFields.forEach((field) => {
      const newNote = {
        title: "test",
        content: "Test new note content...",
        folder_id: 2,
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newNote[field];

        return supertest(app)
          .post("/api/notes")
          .send(newNote)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });

  describe(`DELETE /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456;
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note doesn't exist` } });
      });
    });
    context("Given there are notes in the database", () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it("responds with 204 and removes the note", () => {
        const idToRemove = 2;
        const expectedNotes = testNotes.filter(
          (note) => note.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/notes`).expect(expectedNotes)
          );
      });
    });
  });
});

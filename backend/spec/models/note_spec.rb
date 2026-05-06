require "rails_helper"

RSpec.describe Note, type: :model do
  describe "validity" do
    it "is valid with a title and a user" do
      note = build(:note)
      expect(note).to be_valid
    end

    it "is valid with title and content" do
      note = build(:note, content: "Some content here.")
      expect(note).to be_valid
    end

    it "is valid without content (blank)" do
      note = build(:note, content: "")
      expect(note).to be_valid
    end

    it "is valid without content (nil)" do
      note = build(:note, content: nil)
      expect(note).to be_valid
    end

    it "is valid with a title with less 100 characters" do
      note = build(:note, title: "a" * 99)
      expect(note).to be_valid
    end

    it "is valid with a title of exactly 100 characters" do
      note = build(:note, title: "a" * 100)
      expect(note).to be_valid
    end

    it "is not valid a title with more 100 characters" do
      note = build(:note, title: "a" * 101)
      expect(note).not_to be_valid
    end

    it "is valid with content with less 600 characters" do
      note = build(:note, content: "a" * 599)
      expect(note).to be_valid
    end

    it "is valid with content of exactly 600 characters" do
      note = build(:note, content: "a" * 600)
      expect(note).to be_valid
    end

    it "is not valid a content with more 600 characters" do
      note = build(:note, content: "a" * 601)
      expect(note).not_to be_valid
    end

    it "is invalid without a title" do
      note = build(:note, title: nil)
      expect(note).not_to be_valid
      expect(note.errors[:title]).to be_present
    end

    it "is invalid with a blank title" do
      note = build(:note, title: "")
      expect(note).not_to be_valid
      expect(note.errors[:title]).to be_present
    end

    it "is invalid without a user" do
      note = build(:note, user: nil)
      expect(note).not_to be_valid
      expect(note.errors[:user]).to be_present
    end

    it "is invalid with a whitespace-only title" do
      note = build(:note, title: "   ")
      expect(note).not_to be_valid
    end

    it "strips leading and trailing whitespace from the title before validation" do
      note = build(:note, title: "  My Note  ")
      note.valid?
      expect(note.title).to eq("My Note")
    end

    it "is invalid with a single character title" do
      note = build(:note, title: "A")
      expect(note).not_to be_valid
      expect(note.errors[:title]).to be_present
    end

    it "is valid with a title of exactly 2 characters" do
      note = build(:note, title: "AB")
      expect(note).to be_valid
    end

    it "is valid with whitespace-only content" do
      note = build(:note, content: "   ")
      expect(note).to be_valid
    end

    it "allows duplicate titles for the same user" do
      user = create(:user)
      create(:note, user: user, title: "Same title")
      duplicate = build(:note, user: user, title: "Same title")
      expect(duplicate).to be_valid
    end
  end

  describe "error messages" do
    it "reports the correct error when title is blank" do
      note = build(:note, title: "")
      note.valid?
      expect(note.errors[:title]).to include("não pode ficar em branco")
    end

    it "reports the correct error when title is too short" do
      note = build(:note, title: "A")
      note.valid?
      expect(note.errors[:title]).to include("é muito curto (mínimo de 2 caracteres)")
    end

    it "reports the correct error when title is too long" do
      note = build(:note, title: "a" * 101)
      note.valid?
      expect(note.errors[:title]).to include("é muito longo (máximo de 100 caracteres)")
    end

    it "reports the correct error when content is too long" do
      note = build(:note, content: "a" * 601)
      note.valid?
      expect(note.errors[:content]).to include("é muito longo (máximo de 600 caracteres)")
    end
  end

  describe "associations" do
    it "belongs to a user" do
      user = create(:user)
      note = create(:note, user: user)
      expect(note.user).to eq(user)
    end

    it "is included in the user's notes collection" do
      user = create(:user)
      note = create(:note, user: user)
      expect(user.notes).to include(note)
    end

    it "allows a user to have multiple notes" do
      user = create(:user)
      note1 = create(:note, user: user)
      note2 = create(:note, user: user)
      expect(user.notes).to contain_exactly(note1, note2)
    end

    it "is not visible in another user's notes collection" do
      owner = create(:user)
      other = create(:user)
      note  = create(:note, user: owner)
      expect(other.notes).not_to include(note)
    end
  end

  describe "persistence" do
    it "can be persisted to the database" do
      note = create(:note)
      expect(Note.find(note.id)).to eq(note)
    end

    it "can update the title" do
      note = create(:note, title: "Original title")
      note.update!(title: "Updated title")
      expect(note.reload.title).to eq("Updated title")
    end

    it "can update the content" do
      note = create(:note, content: "Original content")
      note.update!(content: "Updated content")
      expect(note.reload.content).to eq("Updated content")
    end

    it "can be destroyed" do
      note = create(:note)
      id = note.id
      note.destroy
      expect(Note.find_by(id: id)).to be_nil
    end

    it "is destroyed when its user is destroyed" do
      user = create(:user)
      note = create(:note, user: user)
      user.destroy
      expect(Note.find_by(id: note.id)).to be_nil
    end

    it "cannot update title to blank" do
      note = create(:note)
      note.update(title: "")
      expect(note).not_to be_valid
      expect(note.errors[:title]).to be_present
    end

    it "cannot update title beyond 100 characters" do
      note = create(:note)
      note.update(title: "a" * 101)
      expect(note).not_to be_valid
    end

    it "cannot update content beyond 600 characters" do
      note = create(:note)
      note.update(content: "a" * 601)
      expect(note).not_to be_valid
    end

    it "can clear content after it had a value" do
      note = create(:note, content: "some content")
      note.update!(content: nil)
      expect(note.reload.content).to be_nil
    end

    it "does not persist an invalid title update to the database" do
      note = create(:note, title: "Original")
      note.update(title: "")
      expect(note.reload.title).to eq("Original")
    end
  end

  describe "scopes" do
    describe ".search_by_title" do
      let(:user) { create(:user) }
      let!(:rails_note) { create(:note, user: user, title: "Rails tutorial") }
      let!(:ruby_note)  { create(:note, user: user, title: "Ruby tips") }
      let!(:other_note) { create(:note, user: user, title: "Docker guide") }

      it "finds notes by partial title match" do
        expect(Note.search_by_title("Rails")).to include(rails_note)
        expect(Note.search_by_title("Rails")).not_to include(ruby_note, other_note)
      end

      it "is case-insensitive" do
        expect(Note.search_by_title("rails")).to include(rails_note)
        expect(Note.search_by_title("RUBY")).to include(ruby_note)
      end

      it "returns empty when no notes match" do
        expect(Note.search_by_title("Python")).to be_empty
      end

      it "escapes SQL wildcard characters in the query" do
        wild_note = create(:note, user: user, title: "100% done")
        expect(Note.search_by_title("100%")).to include(wild_note)
        expect(Note.search_by_title("100%")).not_to include(rails_note, ruby_note, other_note)
      end
    end
  end
end

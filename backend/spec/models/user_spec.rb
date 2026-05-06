require "rails_helper"

RSpec.describe User, type: :model do
  describe "validity" do
    it "is valid with name, email, and password" do
      user = build(:user)
      expect(user).to be_valid
    end

    it "is valid with a typical email format" do
      user = build(:user, email: "test@example.com")
      expect(user).to be_valid
    end

    it "is valid with a mixed-case email" do
      user = build(:user, email: "TEST@Example.COM")
      expect(user).to be_valid
    end

    it "is invalid without a name" do
      user = build(:user, name: nil)
      expect(user).not_to be_valid
      expect(user.errors[:name]).to be_present
    end

    it "is invalid with a blank name" do
      user = build(:user, name: "")
      expect(user).not_to be_valid
    end

    it "is invalid without an email" do
      user = build(:user, email: nil)
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "is invalid with a malformed email" do
      user = build(:user, email: "not-an-email")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "is invalid with an email missing the domain" do
      user = build(:user, email: "user@")
      expect(user).not_to be_valid
    end

    it "is invalid without a password on a new record" do
      user = build(:user, password: nil)
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "is invalid with a password shorter than 8 characters" do
      user = build(:user, password: "Short1!")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "is valid with a password of exactly 8 characters" do
      user = build(:user, password: "Exact8c!")
      expect(user).to be_valid
    end

    it "is invalid with a password longer than 32 characters" do
      user = build(:user, password: "A" + "a" * 30 + "1!")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "is valid with a password of exactly 32 characters" do
      user = build(:user, password: "A" + "a" * 29 + "1!")
      expect(user).to be_valid
    end

    it "is invalid with a password missing an uppercase letter" do
      user = build(:user, password: "password1!")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "is invalid with a password missing a number" do
      user = build(:user, password: "Password!!")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "is invalid with a password missing a special character" do
      user = build(:user, password: "Password1")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "is valid with a password meeting all complexity requirements" do
      user = build(:user, password: "Secure1!")
      expect(user).to be_valid
    end

    it "is invalid when email is already taken (case-insensitive)" do
      create(:user, email: "mary@example.com")
      duplicate = build(:user, email: "MARY@EXAMPLE.COM")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to be_present
    end

    it "is invalid with a whitespace-only name" do
      user = build(:user, name: "   ")
      expect(user).not_to be_valid
    end

    it "is invalid with a name shorter than 3 characters" do
      user = build(:user, name: "ab")
      expect(user).not_to be_valid
      expect(user.errors[:name]).to be_present
    end

    it "is valid with a name of exactly 3 characters" do
      user = build(:user, name: "abc")
      expect(user).to be_valid
    end

    it "is valid with a name of exactly 100 characters" do
      user = build(:user, name: "a" * 100)
      expect(user).to be_valid
    end

    it "is invalid with a name longer than 100 characters" do
      user = build(:user, name: "a" * 101)
      expect(user).not_to be_valid
      expect(user.errors[:name]).to be_present
    end

    it "allows two users to have the same name" do
      create(:user, name: "Alice")
      duplicate = build(:user, name: "Alice")
      expect(duplicate).to be_valid
    end
  end

  describe "error messages" do
    it "reports the correct error when name is blank" do
      user = build(:user, name: "")
      user.valid?
      expect(user.errors[:name]).to include("não pode ficar em branco")
    end

    it "reports the correct error when name is too short" do
      user = build(:user, name: "ab")
      user.valid?
      expect(user.errors[:name]).to include("é muito curto (mínimo de 3 caracteres)")
    end

    it "reports the correct error when name is too long" do
      user = build(:user, name: "a" * 101)
      user.valid?
      expect(user.errors[:name]).to include("é muito longo (máximo de 100 caracteres)")
    end

    it "reports the correct error when email is blank" do
      user = build(:user, email: nil)
      user.valid?
      expect(user.errors[:email]).to include("não pode ficar em branco")
    end

    it "reports the correct error when email format is invalid" do
      user = build(:user, email: "not-an-email")
      user.valid?
      expect(user.errors[:email]).to include("é inválido")
    end

    it "reports the correct error when email is already taken" do
      create(:user, email: "taken@example.com")
      user = build(:user, email: "taken@example.com")
      user.valid?
      expect(user.errors[:email]).to include("já está em uso")
    end

    it "reports the correct error when password is too short" do
      user = build(:user, password: "Short1!")
      user.valid?
      expect(user.errors[:password]).to include("é muito curto (mínimo de 8 caracteres)")
    end

    it "reports the correct error when password lacks complexity" do
      user = build(:user, password: "password1!")
      user.valid?
      expect(user.errors[:password]).to include("deve conter ao menos uma letra maiúscula, um número e um caractere especial (!@#$%^&*)")
    end
  end

  describe "email normalization" do
    it "downcases the email before saving" do
      user = create(:user, email: "TEST@Example.COM")
      expect(user.reload.email).to eq("test@example.com")
    end

    it "persists as lowercase regardless of input casing" do
      user = create(:user, email: "UPPER@DOMAIN.ORG")
      expect(user.email).to eq("upper@domain.org")
    end

    it "downcases the email on update" do
      user = create(:user, email: "test@example.com")
      user.update!(email: "TEST@NEWDOMAIN.COM")
      expect(user.reload.email).to eq("test@newdomain.com")
    end
  end

  describe "authentication (has_secure_password)" do
    it "sets a password_digest on creation" do
      user = create(:user, password: "Secret1!")
      expect(user.password_digest).to be_present
    end

    it "authenticates with the correct password" do
      user = create(:user, password: "Secret1!")
      expect(user.authenticate("Secret1!")).to eq(user)
    end

    it "authenticates after a password update" do
      user = create(:user, password: "OldPass1!")
      user.update!(password: "NewPass1!")
      expect(user.authenticate("NewPass1!")).to eq(user)
    end

    it "does not authenticate with the wrong password" do
      user = create(:user, password: "Secret1!")
      expect(user.authenticate("wrong")).to be(false)
    end

    it "does not authenticate with an empty string" do
      user = create(:user, password: "Secret1!")
      expect(user.authenticate("")).to be(false)
    end

    it "changes password_digest when password is updated" do
      user = create(:user, password: "Original1!")
      old_digest = user.password_digest
      user.update!(password: "Changed1!")
      expect(user.reload.password_digest).not_to eq(old_digest)
    end

    it "does not authenticate with the old password after a password update" do
      user = create(:user, password: "OldPass1!")
      user.update!(password: "NewPass1!")
      expect(user.authenticate("OldPass1!")).to be(false)
    end

    it "does not store the password in plaintext" do
      user = create(:user, password: "Mysecret1!")
      expect(user.password_digest).not_to eq("Mysecret1!")
    end
  end

  describe "password reset token" do
    it "generates a password reset token" do
      user = create(:user)
      token = user.generate_token_for(:password_reset)
      expect(token).to be_present
    end

    it "finds the user by a valid password reset token" do
      user = create(:user)
      token = user.generate_token_for(:password_reset)
      expect(User.find_by_token_for(:password_reset, token)).to eq(user)
    end

    it "returns nil for a tampered token" do
      expect(User.find_by_token_for(:password_reset, "invalid.token.value")).to be_nil
    end

    it "returns nil for a token belonging to a different user" do
      user1 = create(:user)
      user2 = create(:user)
      token = user1.generate_token_for(:password_reset)
      expect(User.find_by_token_for(:password_reset, token)).not_to eq(user2)
    end

    it "is invalidated after a password change" do
      user = create(:user, password: "Before1!")
      token = user.generate_token_for(:password_reset)
      user.update!(password: "After123!")
      expect(User.find_by_token_for(:password_reset, token)).to be_nil
    end
  end

  describe "associations" do
    it "can have many notes" do
      user = create(:user)
      note1 = create(:note, user: user)
      note2 = create(:note, user: user)
      expect(user.notes).to contain_exactly(note1, note2)
    end

    it "destroys notes when destroyed" do
      user = create(:user)
      note = create(:note, user: user)
      user.destroy
      expect(Note.find_by(id: note.id)).to be_nil
    end

    it "can have many refresh tokens" do
      user = create(:user)
      token1 = create(:refresh_token, user: user)
      token2 = create(:refresh_token, user: user)
      expect(user.refresh_tokens).to contain_exactly(token1, token2)
    end

    it "destroys refresh tokens when destroyed" do
      user = create(:user)
      token = create(:refresh_token, user: user)
      user.destroy
      expect(RefreshToken.find_by(id: token.id)).to be_nil
    end
  end

  describe "persistence" do
    it "is invalid when updating email to one already taken" do
      create(:user, email: "taken@example.com")
      user = create(:user, email: "mine@example.com")
      user.update(email: "taken@example.com")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "does not persist an invalid email update to the database" do
      user = create(:user, email: "valid@example.com")
      user.update(email: "not-valid")
      expect(user.reload.email).to eq("valid@example.com")
    end

    it "can be persisted to the database" do
      user = create(:user)
      expect(User.find(user.id)).to eq(user)
    end

    it "can update the name" do
      user = create(:user, name: "Alice")
      user.update!(name: "Alice Smith")
      expect(user.reload.name).to eq("Alice Smith")
    end

    it "can update the email" do
      user = create(:user, email: "old@example.com")
      user.update!(email: "new@example.com")
      expect(user.reload.email).to eq("new@example.com")
    end

    it "can be destroyed" do
      user = create(:user)
      id = user.id
      user.destroy
      expect(User.find_by(id: id)).to be_nil
    end

    it "is valid when updating without providing a password" do
      user = create(:user)
      user.update!(name: "Updated Name")
      expect(user.reload.name).to eq("Updated Name")
    end
  end
end

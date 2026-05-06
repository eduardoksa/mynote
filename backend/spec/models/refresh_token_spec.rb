require "rails_helper"

RSpec.describe RefreshToken, type: :model do
  describe "associations" do
    it "belongs to a user" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      token = RefreshToken.find_by_raw(raw)
      expect(token.user).to eq(user)
    end
  end

  describe "scope :active" do
    it "includes non-revoked, non-expired tokens" do
      user = create(:user)
      RefreshToken.issue_for(user)
      expect(user.refresh_tokens.active.count).to eq(1)
    end

    it "excludes revoked tokens" do
      user = create(:user)
      RefreshToken.issue_for(user)
      user.refresh_tokens.last.update!(revoked: true)
      expect(user.refresh_tokens.active).to be_empty
    end

    it "excludes expired tokens" do
      user = create(:user)
      RefreshToken.issue_for(user)
      user.refresh_tokens.last.update!(expires_at: 1.second.ago)
      expect(user.refresh_tokens.active).to be_empty
    end
  end

  describe ".issue_for" do
    it "returns a raw token string" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      expect(raw).to be_a(String)
      expect(raw).not_to be_empty
    end

    it "creates a refresh token record for the user" do
      user = create(:user)
      expect { RefreshToken.issue_for(user) }.to change { user.refresh_tokens.count }.by(1)
    end

    it "stores a digest instead of the raw token" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      token = user.refresh_tokens.last
      expect(token.token).not_to eq(raw)
      expect(token.token).to eq(RefreshToken.digest(raw))
    end
  end

  describe ".find_by_raw" do
    it "finds the token by the raw value" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      token = RefreshToken.find_by_raw(raw)
      expect(token).to be_a(RefreshToken)
      expect(token.user).to eq(user)
    end

    it "returns nil for an unknown raw token" do
      expect(RefreshToken.find_by_raw("nonexistent")).to be_nil
    end
  end

  describe "#revoke!" do
    it "sets revoked to true" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      token = RefreshToken.find_by_raw(raw)
      expect { token.revoke! }.to change { token.reload.revoked }.from(false).to(true)
    end
  end

  describe "#expired?" do
    it "returns false when expires_at is in the future" do
      user = create(:user)
      RefreshToken.issue_for(user)
      token = user.refresh_tokens.last
      expect(token.expired?).to be(false)
    end

    it "returns true when expires_at is in the past" do
      user = create(:user)
      RefreshToken.issue_for(user)
      token = user.refresh_tokens.last
      token.update!(expires_at: 1.second.ago)
      expect(token.expired?).to be(true)
    end
  end

  describe "#valid_for_use?" do
    it "returns true when not revoked and not expired" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      token = RefreshToken.find_by_raw(raw)
      expect(token.valid_for_use?).to be(true)
    end

    it "returns false when revoked" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      token = RefreshToken.find_by_raw(raw)
      token.revoke!
      expect(token.valid_for_use?).to be(false)
    end

    it "returns false when expired" do
      user = create(:user)
      raw = RefreshToken.issue_for(user)
      token = RefreshToken.find_by_raw(raw)
      token.update!(expires_at: 1.second.ago)
      expect(token.valid_for_use?).to be(false)
    end
  end
end

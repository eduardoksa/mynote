require "rails_helper"

RSpec.describe "POST /api/v1/auth/refresh", type: :request do
  let!(:user) { create(:user) }

  describe "happy path" do
    it "retorna novo access_token com refresh_token válido" do
      raw_token = RefreshToken.issue_for(user)
      post "/api/v1/auth/refresh", params: { refresh_token: raw_token }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["access_token"]).to be_present
    end

    it "retorna novo refresh_token" do
      raw_token = RefreshToken.issue_for(user)
      post "/api/v1/auth/refresh", params: { refresh_token: raw_token }, as: :json

      expect(response.parsed_body["refresh_token"]).to be_present
      expect(response.parsed_body["refresh_token"]).not_to eq(raw_token)
    end

    it "revoga o refresh_token antigo após uso" do
      raw_token = RefreshToken.issue_for(user)
      post "/api/v1/auth/refresh", params: { refresh_token: raw_token }, as: :json

      old_record = RefreshToken.find_by_raw(raw_token)
      expect(old_record.revoked).to be(true)
    end

    it "não permite reusar o refresh_token já consumido" do
      raw_token = RefreshToken.issue_for(user)
      post "/api/v1/auth/refresh", params: { refresh_token: raw_token }, as: :json
      post "/api/v1/auth/refresh", params: { refresh_token: raw_token }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "edge cases" do
    it "retorna 401 com refresh_token inválido" do
      post "/api/v1/auth/refresh", params: { refresh_token: "invalido" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to be_present
    end

    it "retorna 401 com refresh_token revogado" do
      raw_token = RefreshToken.issue_for(user)
      user.refresh_tokens.last.revoke!

      post "/api/v1/auth/refresh", params: { refresh_token: raw_token }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "retorna 401 com refresh_token expirado" do
      raw_token = RefreshToken.issue_for(user)
      user.refresh_tokens.last.update!(expires_at: 1.day.ago)

      post "/api/v1/auth/refresh", params: { refresh_token: raw_token }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "retorna 401 sem parâmetro refresh_token" do
      post "/api/v1/auth/refresh", params: {}, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end

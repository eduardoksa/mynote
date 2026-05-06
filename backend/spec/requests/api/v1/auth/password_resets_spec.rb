require "rails_helper"

RSpec.describe "Auth::PasswordResets", type: :request do
  describe "POST /api/v1/auth/password-reset" do
    it "retorna 200 quando o email existe" do
      create(:user, email: "joao@example.com")
      post "/api/v1/auth/password-reset", params: { email: "joao@example.com" }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["message"]).to be_present
    end

    it "retorna 200 mesmo quando o email não existe (anti-enumeração)" do
      post "/api/v1/auth/password-reset", params: { email: "naoexiste@example.com" }, as: :json

      expect(response).to have_http_status(:ok)
    end

    it "envia email quando o usuário existe" do
      user = create(:user, email: "joao@example.com")
      expect(UserMailer).to receive(:password_reset).with(user).and_call_original

      post "/api/v1/auth/password-reset", params: { email: "joao@example.com" }, as: :json
    end

    it "não envia email quando o usuário não existe" do
      expect(UserMailer).not_to receive(:password_reset)

      post "/api/v1/auth/password-reset", params: { email: "naoexiste@example.com" }, as: :json
    end
  end

  describe "PATCH /api/v1/auth/password-reset/:token" do
    let!(:user) { create(:user, password: "Password1!") }
    let(:token) { user.generate_token_for(:password_reset) }

    it "atualiza a senha com token válido" do
      patch "/api/v1/auth/password-reset/#{token}",
            params: { password: "NewPassword1!", password_confirmation: "NewPassword1!" },
            as: :json

      expect(response).to have_http_status(:ok)
      expect(user.reload.authenticate("NewPassword1!")).to be_truthy
    end

    it "revoga todos os refresh tokens ao resetar a senha" do
      RefreshToken.issue_for(user)
      patch "/api/v1/auth/password-reset/#{token}",
            params: { password: "NewPassword1!", password_confirmation: "NewPassword1!" },
            as: :json

      expect(user.refresh_tokens.pluck(:revoked)).to all(be true)
    end

    it "retorna 422 com token inválido" do
      patch "/api/v1/auth/password-reset/token_invalido",
            params: { password: "NewPassword1!", password_confirmation: "NewPassword1!" },
            as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to be_present
    end

    it "retorna 422 com token expirado" do
      expired_token = travel_to(20.minutes.ago) { user.generate_token_for(:password_reset) }
      patch "/api/v1/auth/password-reset/#{expired_token}",
            params: { password: "NewPassword1!", password_confirmation: "NewPassword1!" },
            as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 422 quando as senhas não coincidem" do
      patch "/api/v1/auth/password-reset/#{token}",
            params: { password: "NewPassword1!", password_confirmation: "diferente" },
            as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 422 com senha que não atende os requisitos de complexidade" do
      patch "/api/v1/auth/password-reset/#{token}",
            params: { password: "senhasimples1", password_confirmation: "senhasimples1" },
            as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end
  end
end

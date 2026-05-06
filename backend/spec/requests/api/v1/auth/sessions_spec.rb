require "rails_helper"

RSpec.describe "Auth::Sessions", type: :request do
  let!(:user) { create(:user, email: "joao@example.com", password: "Password1!") }

  describe "POST /api/v1/auth/login" do
    context "happy path" do
      it "autentica e retorna tokens" do
        post "/api/v1/auth/login", params: { user: { email: "joao@example.com", password: "Password1!" } }, as: :json

        expect(response).to have_http_status(:ok)
        body = response.parsed_body
        expect(body["user"]["email"]).to eq("joao@example.com")
        expect(body["access_token"]).to be_present
        expect(body["refresh_token"]).to be_present
      end

      it "aceita email em caixa alta" do
        post "/api/v1/auth/login", params: { user: { email: "JOAO@EXAMPLE.COM", password: "Password1!" } }, as: :json

        expect(response).to have_http_status(:ok)
      end

      it "cria um refresh token no banco" do
        expect {
          post "/api/v1/auth/login", params: { user: { email: "joao@example.com", password: "Password1!" } }, as: :json
        }.to change(RefreshToken, :count).by(1)
      end
    end

    context "credenciais inválidas" do
      it "retorna 401 com senha errada" do
        post "/api/v1/auth/login", params: { user: { email: "joao@example.com", password: "Senha_errada1" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to be_present
      end

      it "retorna 401 com email inexistente" do
        post "/api/v1/auth/login", params: { user: { email: "naoexiste@example.com", password: "senha123" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it "retorna 401 com campos vazios" do
        post "/api/v1/auth/login", params: { user: { email: "", password: "" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    let(:access_token) { JwtService.encode(user_id: user.id) }
    let(:raw_refresh_token) { RefreshToken.issue_for(user) }

    before { raw_refresh_token }

    it "revoga o refresh token e retorna 204" do
      delete "/api/v1/auth/logout",
             params: { refresh_token: raw_refresh_token },
             headers: { "Authorization" => "Bearer #{access_token}" },
             as: :json

      expect(response).to have_http_status(:no_content)
      expect(user.refresh_tokens.first.revoked).to be true
    end

    it "retorna 401 sem token de acesso" do
      delete "/api/v1/auth/logout", params: { refresh_token: raw_refresh_token }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "retorna 204 mesmo com refresh_token inválido (idempotente)" do
      delete "/api/v1/auth/logout",
             params: { refresh_token: "token_invalido" },
             headers: { "Authorization" => "Bearer #{access_token}" },
             as: :json

      expect(response).to have_http_status(:no_content)
    end
  end
end

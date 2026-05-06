require "rails_helper"

RSpec.describe "POST /api/v1/auth/register", type: :request do
  let(:valid_params) do
    { user: { name: "João Silva", email: "joao@example.com", password: "Password1!", password_confirmation: "Password1!" } }
  end

  describe "happy path" do
    it "cria usuário e retorna tokens" do
      post "/api/v1/auth/register", params: valid_params, as: :json

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["user"]["email"]).to eq("joao@example.com")
      expect(body["access_token"]).to be_present
      expect(body["refresh_token"]).to be_present
    end

    it "persiste o usuário no banco" do
      expect {
        post "/api/v1/auth/register", params: valid_params, as: :json
      }.to change(User, :count).by(1)
    end

    it "normaliza o email para minúsculas" do
      params = valid_params.deep_merge(user: { email: "JOAO@EXAMPLE.COM" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(User.last.email).to eq("joao@example.com")
    end
  end

  describe "validações" do
    it "retorna 422 quando email já está em uso" do
      create(:user, email: "joao@example.com")
      post "/api/v1/auth/register", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "retorna 422 quando email é inválido" do
      params = valid_params.deep_merge(user: { email: "nao-e-email" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 422 quando nome está em branco" do
      params = valid_params.deep_merge(user: { name: "" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 422 quando password está ausente" do
      params = valid_params.deep_merge(user: { password: "", password_confirmation: "" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "não cria usuário quando há erro de validação" do
      params = valid_params.deep_merge(user: { email: "nao-e-email" })
      expect {
        post "/api/v1/auth/register", params: params, as: :json
      }.not_to change(User, :count)
    end

    it "retorna 422 quando password tem menos de 8 caracteres" do
      params = valid_params.deep_merge(user: { password: "Curta1!", password_confirmation: "Curta1!" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "retorna 422 quando password não tem letra maiúscula" do
      params = valid_params.deep_merge(user: { password: "senha_valida1", password_confirmation: "senha_valida1" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 422 quando password não tem número" do
      params = valid_params.deep_merge(user: { password: "Senha_valida!", password_confirmation: "Senha_valida!" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 422 quando password não tem caractere especial" do
      params = valid_params.deep_merge(user: { password: "Senhavalida1", password_confirmation: "Senhavalida1" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "retorna 422 quando password_confirmation não coincide" do
      params = valid_params.deep_merge(user: { password_confirmation: "Outra_senha1" })
      post "/api/v1/auth/register", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end

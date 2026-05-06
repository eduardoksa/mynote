require "rails_helper"

RSpec.describe JwtService do
  let(:user_id) { 42 }

  describe ".encode" do
    it "retorna uma string JWT" do
      token = JwtService.encode(user_id: user_id)
      expect(token).to be_a(String)
      expect(token.split(".").length).to eq(3)
    end

    it "usa a expiração padrão de 1 hora quando não especificada" do
      token = JwtService.encode(user_id: user_id)
      payload = JwtService.decode(token)
      expect(payload["exp"]).to be_within(5).of(1.hour.from_now.to_i)
    end

    it "aceita expiração customizada" do
      exp = 30.minutes.from_now
      token = JwtService.encode(user_id: user_id, exp: exp)
      payload = JwtService.decode(token)
      expect(payload["exp"]).to be_within(5).of(exp.to_i)
    end

    it "inclui o user_id no payload" do
      token = JwtService.encode(user_id: user_id)
      payload = JwtService.decode(token)
      expect(payload["user_id"]).to eq(user_id)
    end
  end

  describe ".decode" do
    it "decodifica um token válido e retorna o payload" do
      token = JwtService.encode(user_id: user_id)
      payload = JwtService.decode(token)
      expect(payload["user_id"]).to eq(user_id)
    end

    it "retorna um HashWithIndifferentAccess" do
      token = JwtService.encode(user_id: user_id)
      payload = JwtService.decode(token)
      expect(payload[:user_id]).to eq(user_id)
      expect(payload["user_id"]).to eq(user_id)
    end

    it "lança AuthenticationError para token expirado" do
      expired_token = JwtService.encode(user_id: user_id, exp: 1.second.ago)
      expect {
        JwtService.decode(expired_token)
      }.to raise_error(JwtService::AuthenticationError)
    end

    it "lança AuthenticationError para token inválido" do
      expect {
        JwtService.decode("token.invalido.qualquer")
      }.to raise_error(JwtService::AuthenticationError)
    end

    it "lança AuthenticationError para token adulterado" do
      token = JwtService.encode(user_id: user_id)
      tampered = token[0..-5] + "XXXX"
      expect {
        JwtService.decode(tampered)
      }.to raise_error(JwtService::AuthenticationError)
    end

    it "lança AuthenticationError para string vazia" do
      expect {
        JwtService.decode("")
      }.to raise_error(JwtService::AuthenticationError)
    end
  end
end

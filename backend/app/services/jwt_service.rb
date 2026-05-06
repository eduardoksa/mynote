module JwtService
  SECRET = Rails.application.secret_key_base
  ALGORITHM = "HS256"
  ACCESS_TOKEN_TTL = 1.hour
  REFRESH_TOKEN_TTL = 30.days

  def self.encode(user_id:, exp: ACCESS_TOKEN_TTL.from_now)
    payload = { user_id: user_id, exp: exp.to_i }
    JWT.encode(payload, SECRET, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: ALGORITHM)
    HashWithIndifferentAccess.new(decoded.first)
  rescue JWT::ExpiredSignature
    raise AuthenticationError, I18n.t("auth.token_expired")
  rescue JWT::DecodeError
    raise AuthenticationError, I18n.t("auth.token_invalid")
  end

  AuthenticationError = Class.new(StandardError)
end

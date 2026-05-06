class Rack::Attack
  # Isenta redes privadas/Docker do rate limiting (usado em testes E2E)
  safelist("allow-local-network") do |req|
    req.ip == "127.0.0.1" ||
      req.ip == "::1" ||
      req.ip.start_with?("172.") ||
      req.ip.start_with?("10.")  ||
      req.ip.start_with?("192.168.")
  end

  # Limita tentativas de login: 5 por IP a cada 20 segundos
  throttle("login/ip", limit: 5, period: 20) do |req|
    req.ip if req.path == "/api/v1/auth/login" && req.post?
  end

  # Limita tentativas de login por email: 10 por hora (proteção contra ataques distribuídos)
  throttle("login/email", limit: 10, period: 3600) do |req|
    if req.path == "/api/v1/auth/login" && req.post?
      req.params.dig("user", "email")&.downcase&.presence
    end
  end

  # Limita registros: 10 por IP a cada hora
  throttle("register/ip", limit: 10, period: 3600) do |req|
    req.ip if req.path == "/api/v1/auth/register" && req.post?
  end

  # Limita solicitações de reset de senha: 5 por IP a cada hora
  throttle("password_reset/ip", limit: 5, period: 3600) do |req|
    req.ip if req.path == "/api/v1/auth/password-reset" && req.post?
  end

  # Limite geral por IP: 300 requisições por 5 minutos
  throttle("req/ip", limit: 300, period: 300) do |req|
    req.ip unless req.path.start_with?("/assets")
  end

  self.throttled_responder = lambda do |req|
    retry_after = (req.env["rack.attack.match_data"] || {})[:period]
    [
      429,
      {
        "Content-Type" => "application/json",
        "Retry-After" => retry_after.to_s
      },
      [ { error: I18n.t("rack_attack.too_many_requests") }.to_json ]
    ]
  end
end

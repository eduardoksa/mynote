class ApplicationController < ActionController::API
  rescue_from StandardError, with: :internal_server_error
  rescue_from JwtService::AuthenticationError, with: :unauthorized

  private

  def authenticate_user!
    token = request.headers["Authorization"]&.split(" ")&.last
    raise JwtService::AuthenticationError, I18n.t("auth.token_missing") unless token

    payload = JwtService.decode(token)
    @current_user = User.find(payload[:user_id])
  rescue ActiveRecord::RecordNotFound
    raise JwtService::AuthenticationError, I18n.t("auth.user_not_found")
  end

  def current_user
    @current_user
  end

  def unauthorized(error)
    render json: { error: error.message }, status: :unauthorized
  end

  def internal_server_error(error)
    Rails.logger.error("Unhandled error: #{error.class}: #{error.message}\n#{error.backtrace&.first(5)&.join("\n")}")
    render json: { error: I18n.t("errors.internal_server_error") }, status: :internal_server_error
  end
end

module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        before_action :authenticate_user!, only: :destroy

        def create
          user = User.find_by(email: params.dig(:user, :email)&.downcase)

          unless user&.authenticate(params.dig(:user, :password))
            return render json: { error: I18n.t("auth.invalid_credentials") }, status: :unauthorized
          end

          access_token = JwtService.encode(user_id: user.id)
          raw_refresh_token = RefreshToken.issue_for(user)

          render json: {
            user: user.as_json(only: %i[id name email]),
            access_token:,
            refresh_token: raw_refresh_token
          }
        end

        def destroy
          record = current_user.refresh_tokens.find_by(token: RefreshToken.digest(params[:refresh_token]))
          record&.revoke!

          head :no_content
        end
      end
    end
  end
end

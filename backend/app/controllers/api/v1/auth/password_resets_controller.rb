module Api
  module V1
    module Auth
      class PasswordResetsController < ApplicationController
        def create
          user = User.find_by(email: params[:email]&.downcase)
          UserMailer.password_reset(user).deliver_later if user
          # Always return 200 to avoid user enumeration
          render json: { message: I18n.t("auth.password_reset.sent") }
        end

        def update
          user = User.find_by_token_for(:password_reset, params[:token])

          unless user
            return render json: { error: I18n.t("auth.password_reset.invalid_token") }, status: :unprocessable_content
          end

          if user.update(password_params)
            user.refresh_tokens.update_all(revoked: true)
            render json: { message: I18n.t("auth.password_reset.success") }
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def password_params
          params.permit(:password, :password_confirmation)
        end
      end
    end
  end
end

module Api
  module V1
    module Auth
      class RegistrationsController < ApplicationController
        def create
          user = User.new(registration_params)

          if user.save
            tokens = issue_tokens(user)
            render json: { user: user_json(user), **tokens }, status: :created
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def registration_params
          params.require(:user).permit(:name, :email, :password, :password_confirmation)
        end

        def issue_tokens(user)
          access_token = JwtService.encode(user_id: user.id)
          raw_refresh_token = RefreshToken.issue_for(user)
          { access_token:, refresh_token: raw_refresh_token }
        end

        def user_json(user)
          user.as_json(only: %i[id name email created_at])
        end
      end
    end
  end
end

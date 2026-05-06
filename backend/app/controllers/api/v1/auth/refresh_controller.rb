module Api
  module V1
    module Auth
      class RefreshController < ApplicationController
        def create
          if params[:refresh_token].blank?
            return render json: { error: I18n.t("auth.invalid_refresh_token") }, status: :unauthorized
          end

          record = RefreshToken.includes(:user).find_by(token: RefreshToken.digest(params[:refresh_token]))

          unless record&.valid_for_use?
            return render json: { error: I18n.t("auth.invalid_refresh_token") }, status: :unauthorized
          end

          record.revoke!
          access_token = JwtService.encode(user_id: record.user_id)
          new_refresh_token = RefreshToken.issue_for(record.user)
          render json: { access_token:, refresh_token: new_refresh_token }
        end
      end
    end
  end
end

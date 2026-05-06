class UserMailer < ApplicationMailer
  def password_reset(user)
    @user = user
    @token = user.generate_token_for(:password_reset)
    @reset_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token=#{@token}"

    mail(to: @user.email, subject: t(".subject"))
  end
end

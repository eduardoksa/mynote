class User < ApplicationRecord
  has_secure_password

  has_many :refresh_tokens, dependent: :destroy
  has_many :notes, dependent: :destroy

  generates_token_for :password_reset, expires_in: 15.minutes do
    BCrypt::Password.new(password_digest).first(10)
  end

  validates :name, presence: true, length: { minimum: 3, maximum: 100 }
  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP },
                    length: { maximum: 254 }
  validates :password, allow_nil: true,
                       length: { minimum: 8, maximum: 32 },
                       format: { with: /\A(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).+\z/, message: :complexity }

  before_save { email.downcase! }
end

class RefreshToken < ApplicationRecord
  belongs_to :user

  scope :active, -> { where(revoked: false).where("expires_at > ?", Time.current) }

  # Generates a raw token, persists its SHA-256 digest, and returns the raw value.
  # The caller is responsible for sending the raw token to the client — it is never stored.
  def self.issue_for(user)
    raw = SecureRandom.hex(64)
    user.refresh_tokens.create!(
      token: digest(raw),
      expires_at: JwtService::REFRESH_TOKEN_TTL.from_now
    )
    raw
  end

  def self.find_by_raw(raw_token)
    find_by(token: digest(raw_token))
  end

  def self.digest(raw_token)
    OpenSSL::HMAC.hexdigest("SHA256", Rails.application.secret_key_base, raw_token)
  end

  def revoke!
    update!(revoked: true)
  end

  def expired?
    expires_at <= Time.current
  end

  def valid_for_use?
    !revoked && !expired?
  end
end

FactoryBot.define do
  factory :refresh_token do
    token { RefreshToken.digest(SecureRandom.hex(64)) }
    expires_at { 30.days.from_now }
    revoked { false }
    association :user
  end
end

FactoryBot.define do
  factory :note do
    title { Faker::Lorem.sentence(word_count: 3).truncate(100) }
    content { Faker::Lorem.paragraph }
    association :user
  end
end

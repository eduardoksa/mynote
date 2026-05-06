class Note < ApplicationRecord
  belongs_to :user

  before_validation { title&.strip! }

  validates :title, presence: true, length: { minimum: 2, maximum: 100 }
  validates :content, length: { maximum: 600 }, allow_blank: true

  scope :search_by_title, ->(q) { where("title ILIKE ?", "%#{sanitize_sql_like(q)}%") }
end

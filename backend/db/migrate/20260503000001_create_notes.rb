class CreateNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :notes do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.string :title, null: false, limit: 100
      t.string :content, limit: 600

      t.timestamps
    end

    add_index :notes, [ :user_id, :created_at ], order: { created_at: :desc }
  end
end

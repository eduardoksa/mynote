module Api
  module V1
    class NotesController < ApplicationController
      before_action :authenticate_user!
      before_action :set_note, only: %i[show update destroy]

      def index
        notes = current_user.notes
        notes = notes.search_by_title(params[:q]) if params[:q].present?
        notes = notes.order(created_at: :desc).page(params[:page]).per(9)

        render json: {
          notes: notes.as_json(only: %i[id title content created_at updated_at]),
          pagination: {
            current_page: notes.current_page,
            per_page:     notes.limit_value,
            total_count:  notes.total_count,
            total_pages:  notes.total_pages,
            next_page:    notes.next_page,
            prev_page:    notes.prev_page
          }
        }
      end

      def create
        note = current_user.notes.build(note_params)

        if note.save
          render json: { note: note.as_json(only: %i[id title content created_at updated_at]) },
                 status: :created
        else
          render json: { errors: note.errors.full_messages }, status: :unprocessable_content
        end
      end

      def show
        render json: { note: @note.as_json(only: %i[id title content created_at updated_at]) }
      end

      def update
        if @note.update(note_params)
          render json: { note: @note.as_json(only: %i[id title content created_at updated_at]) }
        else
          render json: { errors: @note.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @note.destroy
        head :no_content
      end

      private

      def set_note
        @note = current_user.notes.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("notes.not_found") }, status: :not_found
      end

      def note_params
        params.require(:note).permit(:title, :content)
      end
    end
  end
end

Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :notes

      namespace :auth do
        post   "register",              to: "registrations#create"
        post   "login",                 to: "sessions#create"
        delete "logout",                to: "sessions#destroy"
        post   "refresh",               to: "refresh#create"
        post   "password-reset",              to: "password_resets#create"
        patch  "password-reset/:token",        to: "password_resets#update", as: "confirm_password_reset"
      end
    end
  end
end

require "rails_helper"

RSpec.describe "Api::V1::Notes", type: :request do
  let!(:user) { create(:user) }
  let!(:other_user) { create(:user) }
  let(:access_token) { JwtService.encode(user_id: user.id) }
  let(:auth_headers) { { "Authorization" => "Bearer #{access_token}" } }

  describe "GET /api/v1/notes" do
    context "autenticado" do
      before { create_list(:note, 3, user: user) }

      it "retorna as notas do usuário com paginação" do
        get "/api/v1/notes", headers: auth_headers

        expect(response).to have_http_status(:ok)
        body = response.parsed_body
        expect(body["notes"].length).to eq(3)
        expect(body["pagination"]).to include("current_page", "total_pages", "total_count", "per_page")
      end

      it "não retorna notas de outro usuário" do
        create_list(:note, 2, user: other_user)
        get "/api/v1/notes", headers: auth_headers

        expect(response.parsed_body["notes"].length).to eq(3)
      end

      it "pagina corretamente com 9 itens por página" do
        create_list(:note, 8, user: user)
        get "/api/v1/notes", headers: auth_headers

        body = response.parsed_body
        expect(body["notes"].length).to eq(9)
        expect(body["pagination"]["total_count"]).to eq(11)
        expect(body["pagination"]["total_pages"]).to eq(2)
      end

      it "retorna a segunda página" do
        create_list(:note, 8, user: user)
        get "/api/v1/notes", params: { page: 2 }, headers: auth_headers

        expect(response.parsed_body["notes"].length).to eq(2)
        expect(response.parsed_body["pagination"]["current_page"]).to eq(2)
      end

      it "filtra notas pelo parâmetro q" do
        create(:note, title: "UNIQUESEARCH_bolo_XYZ", user: user)
        create(:note, title: "Lista de compras", user: user)
        get "/api/v1/notes", params: { q: "UNIQUESEARCH_bolo_XYZ" }, headers: auth_headers

        notes = response.parsed_body["notes"]
        expect(notes.length).to eq(1)
        expect(notes.first["title"]).to eq("UNIQUESEARCH_bolo_XYZ")
      end

      it "retorna lista vazia quando nenhuma nota corresponde à busca" do
        get "/api/v1/notes", params: { q: "XYZNOTFOUND99999" }, headers: auth_headers

        expect(response.parsed_body["notes"]).to be_empty
        expect(response.parsed_body["pagination"]["total_count"]).to eq(0)
      end
    end

    context "não autenticado" do
      it "retorna 401" do
        get "/api/v1/notes"

        expect(response).to have_http_status(:unauthorized)
      end

      it "retorna 401 com token inválido" do
        get "/api/v1/notes", headers: { "Authorization" => "Bearer token_invalido" }

        expect(response).to have_http_status(:unauthorized)
      end

      it "retorna 401 com token expirado" do
        expired_token = JwtService.encode(user_id: user.id, exp: 1.hour.ago)
        get "/api/v1/notes", headers: { "Authorization" => "Bearer #{expired_token}" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/notes" do
    context "autenticado" do
      it "cria uma nota e retorna 201" do
        post "/api/v1/notes",
             params: { note: { title: "Minha nota", content: "Conteúdo" } },
             headers: auth_headers,
             as: :json

        expect(response).to have_http_status(:created)
        body = response.parsed_body
        expect(body["note"]["title"]).to eq("Minha nota")
        expect(body["note"]["id"]).to be_present
      end

      it "persiste a nota no banco associada ao usuário" do
        expect {
          post "/api/v1/notes",
               params: { note: { title: "Nota", content: "texto" } },
               headers: auth_headers,
               as: :json
        }.to change(user.notes, :count).by(1)
      end

      it "cria nota sem conteúdo" do
        post "/api/v1/notes",
             params: { note: { title: "Sem conteúdo" } },
             headers: auth_headers,
             as: :json

        expect(response).to have_http_status(:created)
      end

      it "retorna 422 sem título" do
        post "/api/v1/notes",
             params: { note: { title: "", content: "texto" } },
             headers: auth_headers,
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]).to be_present
      end

      it "retorna 422 com título acima de 100 caracteres" do
        post "/api/v1/notes",
             params: { note: { title: "a" * 101 } },
             headers: auth_headers,
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end

      it "retorna 422 com conteúdo acima de 600 caracteres" do
        post "/api/v1/notes",
             params: { note: { title: "Título", content: "a" * 601 } },
             headers: auth_headers,
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end

      it "aceita título com exatamente 100 caracteres" do
        post "/api/v1/notes",
             params: { note: { title: "a" * 100 } },
             headers: auth_headers,
             as: :json

        expect(response).to have_http_status(:created)
      end

      it "aceita conteúdo com exatamente 600 caracteres" do
        post "/api/v1/notes",
             params: { note: { title: "Título", content: "a" * 600 } },
             headers: auth_headers,
             as: :json

        expect(response).to have_http_status(:created)
      end
    end

    context "não autenticado" do
      it "retorna 401" do
        post "/api/v1/notes", params: { note: { title: "Nota" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/notes/:id" do
    let!(:note) { create(:note, user: user) }

    context "autenticado" do
      it "retorna a nota" do
        get "/api/v1/notes/#{note.id}", headers: auth_headers

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["note"]["id"]).to eq(note.id)
      end

      it "retorna 404 para nota de outro usuário" do
        other_note = create(:note, user: other_user)
        get "/api/v1/notes/#{other_note.id}", headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end

      it "retorna 404 para id inexistente" do
        get "/api/v1/notes/#{Note.maximum(:id).to_i + 9999}", headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context "não autenticado" do
      it "retorna 401" do
        get "/api/v1/notes/#{note.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PATCH /api/v1/notes/:id" do
    let!(:note) { create(:note, title: "Título original", user: user) }

    context "autenticado" do
      it "atualiza a nota e retorna 200" do
        patch "/api/v1/notes/#{note.id}",
              params: { note: { title: "Novo título" } },
              headers: auth_headers,
              as: :json

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["note"]["title"]).to eq("Novo título")
        expect(note.reload.title).to eq("Novo título")
      end

      it "retorna 422 com título inválido" do
        patch "/api/v1/notes/#{note.id}",
              params: { note: { title: "" } },
              headers: auth_headers,
              as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(note.reload.title).to eq("Título original")
      end

      it "retorna 404 para nota de outro usuário" do
        other_note = create(:note, user: other_user)
        patch "/api/v1/notes/#{other_note.id}",
              params: { note: { title: "Invasão" } },
              headers: auth_headers,
              as: :json

        expect(response).to have_http_status(:not_found)
        expect(other_note.reload.title).not_to eq("Invasão")
      end
    end

    context "não autenticado" do
      it "retorna 401" do
        patch "/api/v1/notes/#{note.id}", params: { note: { title: "x" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/notes/:id" do
    let!(:note) { create(:note, user: user) }

    context "autenticado" do
      it "remove a nota e retorna 204" do
        delete "/api/v1/notes/#{note.id}", headers: auth_headers

        expect(response).to have_http_status(:no_content)
        expect(Note.find_by(id: note.id)).to be_nil
      end

      it "decrementa o total de notas" do
        expect {
          delete "/api/v1/notes/#{note.id}", headers: auth_headers
        }.to change(user.notes, :count).by(-1)
      end

      it "retorna 404 para nota de outro usuário" do
        other_note = create(:note, user: other_user)
        delete "/api/v1/notes/#{other_note.id}", headers: auth_headers

        expect(response).to have_http_status(:not_found)
        expect(Note.find_by(id: other_note.id)).to be_present
      end

      it "retorna 404 para id inexistente" do
        delete "/api/v1/notes/#{Note.maximum(:id).to_i + 9999}", headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context "não autenticado" do
      it "retorna 401" do
        delete "/api/v1/notes/#{note.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

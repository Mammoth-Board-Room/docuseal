# frozen_string_literal: true

describe 'Embed scripts' do
  describe 'GET /js/:filename' do
    it 'serves the embedded signing form widget' do
      get '/js/form.js'

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq('application/javascript')
      expect(response.body).to include("customElements.define('docuseal-form'")
      expect(response.body).to include('data-src')
      expect(response.body).not_to include('Upgrade to Pro')
    end
  end

  describe 'Docuseal.embed_script_url' do
    it 'points at the app-hosted embed script' do
      expect(Docuseal.embed_script_url).to include('/js/form.js')
      expect(Docuseal.embed_script_url).not_to include('cdn.docuseal.com')
    end
  end
end

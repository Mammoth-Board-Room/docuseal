# frozen_string_literal: true

class EmbedScriptsController < ActionController::Metal
  SCRIPT_PATH = Rails.root.join('app/javascript/embed/form.js')

  def show
    headers['Content-Type'] = 'application/javascript; charset=utf-8'
    headers['Cache-Control'] = Rails.env.production? ? 'public, max-age=3600' : 'no-store'

    self.response_body = SCRIPT_PATH.read
    self.status = 200
  end
end

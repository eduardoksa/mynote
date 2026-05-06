Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :none
    policy.script_src  :self
    policy.style_src   :self
    policy.img_src     :self, :data
    policy.font_src    :self
    policy.connect_src :self
    policy.frame_ancestors :none
    policy.base_uri    :self
    policy.form_action :self
  end

  # Envia o header como enforce (não apenas report)
  config.content_security_policy_report_only = false
end

<div class="container-lg px-md-4 brand-container lumina-brand-container">
	<div class="col-12 d-flex border-bottom pb-3 {{{ if config.theme.centerHeaderElements }}}justify-content-center{{{ end }}}">
		<div component="brand/wrapper" class="d-flex align-items-center gap-3 p-2 rounded-1 align-content-stretch lumina-brand">
			<a component="brand/anchor" href="{relative_path}/" title="Lumina Mud — Forum" class="d-flex align-items-center gap-3 text-decoration-none">
				<img component="brand/logo" alt="Lumina Mud" src="/plugins/nodebb-theme-lumina/static/logo-gold.svg?{config.cache-buster}" class="lumina-brand-logo" />
				<span class="lumina-brand-text d-flex flex-column">
					<span class="lumina-brand-title">Lumina Mud</span>
					<span class="lumina-brand-subtitle">Forum</span>
				</span>
			</a>
		</div>
		{{{ if widgets.brand-header.length }}}
		<div data-widget-area="brand-header" class="flex-fill gap-3 p-2 align-self-center">
			{{{each widgets.brand-header}}}
			{{./html}}
			{{{end}}}
		</div>
		{{{ end }}}
	</div>
</div>

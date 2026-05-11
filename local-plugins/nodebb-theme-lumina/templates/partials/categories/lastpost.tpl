<div class="lastpost border-start border-2 lh-sm h-100" style="border-color: {./bgColor}!important;">
	{{{ each ./posts }}}
	{{{ if @first }}}
	<div component="category/posts" class="ps-2 text-xs d-flex flex-column h-100 gap-1">
		<div class="d-flex align-items-center gap-1 text-nowrap overflow-hidden">
			<a class="text-decoration-none avatar-tooltip flex-shrink-0" title="{./user.displayname}" href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(posts.user, "18px", true)}</a>
			<a class="text-reset text-decoration-none text-truncate fw-semibold" href="{config.relative_path}/user/{./user.userslug}">{./user.displayname}</a>
			<a class="permalink text-muted timeago text-xs flex-shrink-0 ms-auto" href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}" title="{./timestampISO}" aria-label="[[global:lastpost]]"></a>
		</div>
		<div class="post-content text-xs text-truncate lh-sm position-relative flex-fill">
			<a class="stretched-link text-reset" tabindex="-1" href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}" aria-label="[[global:lastpost]]">{./topic.title}</a>
		</div>
	</div>
	{{{ end }}}
	{{{ end }}}

	{{{ if !./posts.length }}}
	<div component="category/posts" class="ps-2">
		<div class="post-content overflow-hidden text-xs">
			[[category:no-new-posts]]
		</div>
	</div>
	{{{ end }}}
</div>

'use strict';

// Inietta un toggle "Modifica" nella tab bar dei topic listings
// (category, recent, unread, popular, top, world, tag).
// Al click attiva `body.lumina-edit-mode`: la SCSS in _topics.scss
// reagisce mostrando i checkbox `[component="topic/select"]` 24x24
// nella gutter sinistra del row. Senza la classe, niente checkbox.
//
// Il pulsante si mostra solo agli utenti per cui harmony renderizza
// l'elemento `.checkbox` nel template (= showSelect=true, ovvero
// chi ha il privilegio bulk-moderate sui topic della categoria).
$(document).ready(function () {
	luminaInitEditMode();
	$(window).on('action:ajaxify.end', luminaInitEditMode);
});

function luminaInitEditMode() {
	var $bar = $('[component="category/controls"]');
	var hasTopicList = $('ul[component="category"]').length > 0;
	var canSelect = $('[component="category/topic"] .checkbox').length > 0;

	if (!$bar.length || !hasTopicList || !canSelect) {
		return;
	}

	if ($bar.find('.lumina-edit-toggle').length) {
		return;
	}

	var $btn = $(
		'<button type="button" class="btn btn-ghost btn-sm d-flex gap-2 align-items-center fw-semibold h-100 lumina-edit-toggle" ' +
			'title="Mostra le caselle di selezione per modifica/spostamento/cancellazione bulk dei topic">' +
			'<i class="fa fa-fw fa-check-square-o text-primary"></i>' +
			'<span class="visible-md-inline visible-lg-inline">Modifica</span>' +
		'</button>'
	);

	$btn.on('click', function () {
		var $body = $('body');
		var on = $body.toggleClass('lumina-edit-mode').hasClass('lumina-edit-mode');
		$btn.toggleClass('active', on);
		$btn.attr('aria-pressed', on ? 'true' : 'false');
		if (!on) {
			// Uscendo dal modo modifica, deseleziona tutto.
			$('[component="category/topic"].selected').removeClass('selected');
			$('[component="topic/select"].fa-check-square-o')
				.removeClass('fa-check-square-o')
				.addClass('fa-square-o');
		}
	});

	$bar.prepend($btn);
}

// Screenshot helper for the maker's own screenshots (?shot=cover|editor).
// Reads the query string, loads a bundled sample photo, applies the caption,
// layout, grade and size, then renders. Used only to take screenshots/; the
// editor works the same way without any query string.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  document.body.classList.add(`shot-${shot}`);
  const cover = window.__cover;
  const apply = async () => {
    const size = params.get('size');
    const layout = params.get('layout');
    const grade = params.get('grade');
    const caption = params.get('caption');
    const subtitle = params.get('subtitle');
    if (size && cover.SIZES[size]) {
      cover.state.size = size;
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === size));
    }
    if (layout) cover.state.layout = layout;
    if (grade) cover.state.grade = grade;
    if (caption) {
      cover.state.title = caption;
      document.getElementById('title').value = caption;
    }
    if (subtitle) {
      cover.state.subtitle = subtitle;
      document.getElementById('subtitle').value = subtitle;
    }
    const photo = params.get('photo');
    if (photo) {
      await cover.loadSample(photo);
      if (params.get('fill') === 'all') {
        document.getElementById('fillAll').click();
      }
    }
    cover.render();
    document.title = `shot:${shot}`;
  };
  // Wait a tick so main.js has bound its controls before we drive them.
  setTimeout(apply, 30);
}

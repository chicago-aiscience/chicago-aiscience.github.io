from research import BASE_DIR


def test_base_dir_is_correct():
    basedir_entries = [entry.name for entry in BASE_DIR.iterdir()]
    assert "assets" in basedir_entries
    assert "gen_assets" in basedir_entries

## UChicago AI + SCIENCE github pages repo

First -- giving credit where credit is due, this is based on the template *Feeling Responsive*. You can find more information about it [here](http://phlow.github.io/feeling-responsive/).


## Some notes on this

- There is a `makefile`, `DockerFile` and `Gemfile` inside this repo that mimic the way that github pages work. If you wish to develop on this code start by cloning and running `make serve`. 

    - `_config.yml` is the main config, but when running locally the `_config_local.yml` is overlaid.

- If you receive any `gem`, `bundle` issues, try `make rebuild` to do a full clean.
  
- There is _soooo_ much stuff in this repo that is unused. The feeling responsive repo has a ton of stuff that we are not using. While a lot of files and stuff have been deleted there is still quite a bit of detritus lying about. 
package main

import "log"

func main() {
	config, err := LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	app, err := NewApplication(config)
	if err != nil {
		log.Fatal(err)
	}
	defer app.Close()

	if err := app.Run(config); err != nil {
		log.Fatal(err)
	}
}

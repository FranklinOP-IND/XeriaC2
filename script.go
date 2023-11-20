package main

import (
	"fmt"
	"log"
	"os"

	"github.com/valyala/fasthttp"
)

func main() {
	// Pastikan argumen telah diberikan saat menjalankan skrip
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run script.go <URL>")
		os.Exit(1)
	}

	url := os.Args[1]

	// Buat klien fasthttp
	client := &fasthttp.Client{}

	// Buat permintaan GET
	statusCode, body, err := sendRequest(client, "GET", url, nil)
	if err != nil {
		log.Fatal(err)
	}

	// Cetak status code dan body dari respons
	fmt.Printf("GET Request Status Code: %d\n", statusCode)
	fmt.Printf("GET Request Body: %s\n", body)
}

func sendRequest(client *fasthttp.Client, method, url string, body []byte) (int, []byte, error) {
	req := fasthttp.AcquireRequest()
	req.SetRequestURI(url)
	req.Header.SetMethod(method)

	if body != nil {
		req.SetBody(body)
	}

	resp := fasthttp.AcquireResponse()

	err := client.Do(req, resp)
	if err != nil {
		return 0, nil, err
	}

	statusCode := resp.StatusCode()
	respBody := resp.Body()

	return statusCode, respBody, nil
}

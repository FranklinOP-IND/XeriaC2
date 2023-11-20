package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

func main() {
	// Pastikan argumen telah diberikan saat menjalankan skrip
	if len(os.Args) != 3 {
		fmt.Println("Usage: go run script.go <URL> <Method>")
		os.Exit(1)
	}

	url := os.Args[1]
	method := os.Args[2]

	// Lakukan pengecekan metode yang valid
	if method != "GET" && method != "POST" {
		fmt.Println("Invalid method. Please use GET or POST.")
		os.Exit(1)
	}

	// Kirim permintaan HTTP
	response, err := sendHTTPRequest(url, method)
	if err != nil {
		fmt.Println("Error sending HTTP request:", err)
		os.Exit(1)
	}

	// Cetak respons dari server
	fmt.Println("Response from server:")
	fmt.Println(string(response))
}

func sendHTTPRequest(url, method string) ([]byte, error) {
	// Persiapkan permintaan HTTP
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}

	// Lakukan permintaan HTTP
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Baca respons dari server
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

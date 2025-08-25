import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { serbian_cities } from '../serbian-cities';
import { city_images } from '../city-images';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: [{
    description: string;
    main: string;
  }];
  wind: {
    speed: number;
  };
}

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit, OnDestroy {
  city = 'Novi Sad';
  weather: WeatherData | null = null;
  errorMessage: string = '';
  isLoading: boolean = true;
  now: Date = new Date();
  filteredCities: string[] = [];
  showDropdown: boolean = false;
  allCities: string[] = serbian_cities;
  selectedCityIndex: number = -1;
  backgroundImage: string = '';
  isImageLoading: boolean = false;
  private refreshInterval: any;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.setBackgroundImage(this.city);
    this.loadWeather();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  setBackgroundImage(cityName: string) {
    this.isImageLoading = true;
    
    setTimeout(() => {
      this.backgroundImage = city_images[cityName] || city_images['default'];
      
      const img = new Image();
      img.onload = () => {
        this.isImageLoading = false;
      };
      img.onerror = () => {
        this.backgroundImage = city_images['default'];
        this.isImageLoading = false;
      };
      img.src = this.backgroundImage;
    }, 0);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.showDropdown) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveSelection(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveSelection(-1);
        break;
      case 'Enter':
        if (this.selectedCityIndex >= 0) {
          event.preventDefault();
          this.selectCity(this.filteredCities[this.selectedCityIndex]);
        }
        break;
      case 'Escape':
        this.showDropdown = false;
        this.selectedCityIndex = -1;
        break;
    }
  }

  moveSelection(direction: number) {
    const newIndex = this.selectedCityIndex + direction;
    
    if (newIndex >= 0 && newIndex < this.filteredCities.length) {
      this.selectedCityIndex = newIndex;
      setTimeout(() => {
        const selectedElement = document.querySelector('.city_option.selected');
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest' });
        }
      }, 0);
    }
  }

  filterCities() {
    if (this.city.length > 1) {
      this.filteredCities = this.allCities.filter(city =>
        city.toLowerCase().includes(this.city.toLowerCase())
      );
      this.showDropdown = this.filteredCities.length > 0;
      this.selectedCityIndex = -1;
    } else {
      this.filteredCities = [];
      this.showDropdown = false;
      this.selectedCityIndex = -1;
    }
  }

  selectCity(city: string) {
    this.city = city;
    this.showDropdown = false;
    this.selectedCityIndex = -1;
    this.setBackgroundImage(city);
    this.loadWeather();
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
      this.selectedCityIndex = -1;
    }, 200);
  }

  onFocus() {
    if (this.city.length > 1) {
      this.filterCities();
    }
  }

  loadWeather() {
    this.isLoading = true;
    this.errorMessage = '';
    this.showDropdown = false;
    this.selectedCityIndex = -1;
    
    const apiKey = '598e3b5b47b246c56cad574019095f46';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${this.city},RS&appid=${apiKey}&units=metric`;

    this.http.get<WeatherData>(apiUrl).subscribe({
      next: (data) => {
        this.weather = data;
        this.isLoading = false;
        this.now = new Date();
      },
      error: (error: HttpErrorResponse) => {
        console.error('API error:', error);
        this.errorMessage = error.status === 404 
          ? 'City not found.'
          : 'Failed to load weather data. Please try again later.';
        this.isLoading = false;
        this.weather = null;
      }
    });
  }

  onSearch(event?: Event) {
    if (event) {
      event.preventDefault();
    }
  
    if (this.city.trim()) {
      this.setBackgroundImage(this.city);
      this.loadWeather();
    }
}

  private setupAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      if (this.city.trim()) {
        console.log('Auto-refreshing weather data...');
        this.loadWeather();
      }
    }, 10 * 60 * 1000);
  }

  getWeatherIcon(condition: string): string {
    const icons: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Drizzle': '🌦️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    };
    return icons[condition] || '🌤️';
  }
}
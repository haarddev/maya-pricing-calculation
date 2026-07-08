import { PricingMethod } from '@prisma/client';

export type ClientTemplateSeed = {
  name: string;
  description: string;
  supplementsAdditions: string;
  pricingMethod: PricingMethod;
};

/**
 * Deduplicated client templates from the pricing spreadsheet.
 * Special Notes → description; Supplements/Additions → supplementsAdditions.
 */
export const CLIENT_TEMPLATES: ClientTemplateSeed[] = [
  {
    name: 'Price by Route and Vehicle Type',
    supplementsAdditions:
      'Supplement for combining destinations, night and Saturday supplement, Highway 6 supplement',
    description:
      'Committed to 15 buses and 30 minibuses doing 4 routes every day. Even if there are taxi routes (ordered/planned), at the end of the month this is changed according to the commitment.',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Price by Destination',
    supplementsAdditions: '',
    description: '',
    pricingMethod: 'PRICE_BY_DESTINATION',
  },
  {
    name: 'Price by Route and Vehicle Type (Stop Supplement)',
    supplementsAdditions:
      'Stop supplement, night and Saturday supplement, Highway 6 supplement',
    description: '',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Shuttle - Price by Hours',
    supplementsAdditions: '',
    description: 'Committed to hours',
    pricingMethod: 'PRICE_BY_HOURS',
  },
  {
    name: 'Categories: Up to 6h/150km, 12h/300km, 50km Supplement',
    supplementsAdditions: '',
    description:
      'By categories: up to 6 hours and 150 km / up to 12 hours and 300 km / supplement for every 50 km',
    pricingMethod: 'PRICE_BY_KM_AND_HOURS',
  },
  {
    name: 'Price by Route and Vehicle Type (Night & Cancellation)',
    supplementsAdditions:
      'Night supplement, cancellation penalty up to 4 days in advance',
    description: '',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Price for 8/10/12 Hours by Vehicle Type',
    supplementsAdditions: 'Highway 6 supplement',
    description: '',
    pricingMethod: 'PRICE_BY_HOURS',
  },
  {
    name: 'Price by Route and Vehicle Type (Standard)',
    supplementsAdditions: '',
    description: '',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name:
      'Combined Trip Return - Same Vehicle Within 1 Hour',
    supplementsAdditions:
      'Cancellation after arrival 75% / Saturday supplement / return of the same vehicle type 67% for the return',
    description:
      'Price by route and vehicle type, there is a different price for the return of a combined trip (return within a time range of up to an hour from the outbound trip performed by the same vehicle)',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Round Trip - Same Vehicle Within 1 Hour',
    supplementsAdditions: '',
    description:
      'Price by route and vehicle type, there is a different price for round trip when the time range between outbound and return is up to an hour and it is the same vehicle type',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Price by Route and Vehicle Type (Cancellation Penalties)',
    supplementsAdditions: 'Cancellation penalties',
    description: '',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Polygon & Vehicle Type Price List (6 Polygons, 60% Combining)',
    supplementsAdditions: '',
    description:
      'Price list by 6 possible polygons and vehicle types. Combining polygons is an additional 60%.',
    pricingMethod: 'PRICE_BY_AREA',
  },
  {
    name: 'Dedicated Price List by Vehicle Type and Destination',
    supplementsAdditions: '',
    description: '',
    pricingMethod: 'PRICE_BY_DESTINATION',
  },
  {
    name: 'Short Trips (Drops) by Vehicle Type and Destination',
    supplementsAdditions: '',
    description: '',
    pricingMethod: 'PRICE_BY_DESTINATION',
  },
  {
    name: 'Price per Km by Vehicle Type (Tiered Km Groups)',
    supplementsAdditions: '',
    description:
      'Price per km only by vehicle type, there is a price per km by km groups (up to 20 km / 21-60 / 61-120 / 121-200 / 201-300)',
    pricingMethod: 'PRICE_BY_DISTANCE',
  },
  {
    name: 'Daily Shuttle Price (Divided by Hours)',
    supplementsAdditions: '',
    description:
      'Daily price for shuttle - in the system it is by hours but the price is daily and divided by hours',
    pricingMethod: 'PRICE_BY_HOURS',
  },
  {
    name: 'Price by Route and Vehicle Type (Night & Saturday Rates)',
    supplementsAdditions: '',
    description:
      'Price by route and vehicle type, different price for night and Saturday',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Workday FD/HD Pricing (YIT Weekly Arrangement)',
    supplementsAdditions: '',
    description:
      'Price for a workday is defined in the system as FD, price for a half workday is defined as HD, price for transfer is also according to settings in the order. Advanced through weekly arrangement in YIT and today there is automatic pricing except for deviations from 200 km',
    pricingMethod: 'PRICE_BY_HOURS',
  },
  {
    name: 'Pricing by Passenger Count and Vehicle Type',
    supplementsAdditions: '',
    description:
      'Pricing by number of passengers (up to 2 passengers price / up to 4 passengers price) and price by vehicle types for a larger amount',
    pricingMethod: 'PRICE_BY_PASSENGERS',
  },
  {
    name: 'Route & Vehicle Type with Combined Pickup (20% Discount)',
    supplementsAdditions: '',
    description:
      'Price by route and vehicle type, when there is a combined distribution for pickup there is a 20% discount on the distribution',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Price by Cluster and Km Groups',
    supplementsAdditions: '',
    description:
      'Price by cluster (center / north / south) and in each cluster by km groups and vehicle type',
    pricingMethod: 'PRICE_BY_AREA',
  },
  {
    name: 'Price by Route, Vehicle Type and Fixed Time',
    supplementsAdditions: '',
    description: 'Price by route + vehicle type and fixed time',
    pricingMethod: 'PRICE_BY_ROUTE',
  },
  {
    name: 'Price by SKU (Catalog Number)',
    supplementsAdditions: '',
    description: 'Price by SKU (catalog number) in the agreement',
    pricingMethod: 'PRICE_BY_SKU',
  },
  {
    name: 'Routes by Destination',
    supplementsAdditions: '',
    description: '',
    pricingMethod: 'PRICE_BY_DESTINATION',
  },
  {
    name: 'Routes up to 25 Km Fixed Price',
    supplementsAdditions: '',
    description: '',
    pricingMethod: 'PRICE_BY_DISTANCE',
  },
  {
    name: 'Km and Hours Combined Pricing',
    supplementsAdditions: '',
    description: 'Km and hours',
    pricingMethod: 'PRICE_BY_KM_AND_HOURS',
  },
  {
    name: 'Return Drops Discount (70% up to Km Limit)',
    supplementsAdditions: 'Drops on the return have 70% up to a certain km',
    description: '',
    pricingMethod: 'PRICE_BY_DESTINATION',
  },
  {
    name: 'Taxis by Minutes',
    supplementsAdditions: '',
    description: '',
    pricingMethod: 'PRICE_BY_MINUTES',
  },
  {
    name: 'Price per Km and Dedicated Hours',
    supplementsAdditions: '',
    description: 'Price per km and dedicated hours',
    pricingMethod: 'PRICE_BY_KM_AND_HOURS',
  },
];

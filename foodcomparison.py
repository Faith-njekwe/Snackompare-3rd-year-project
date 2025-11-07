import requests
import json

class ProductComparator:
    def __init__(self):
        self.base_url = "https://world.openfoodfacts.org/api/v0/product/"
    
    def search_products(self, query):
        """Search for products by name"""
        search_url = f"https://world.openfoodfacts.org/cgi/search.pl"
        params = {
            'search_terms': query,
            'search_simple': 1,
            'json': 1,
            'page_size': 5
        }
        
        try:
            response = requests.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('products', [])
        except requests.exceptions.RequestException as e:
            print(f"Error searching for products: {e}")
            return []
    
    def get_product_by_barcode(self, barcode):
        """Get product by barcode"""
        try:
            response = requests.get(f"{self.base_url}{barcode}.json")
            response.raise_for_status()
            data = response.json()
            return data.get('product') if data.get('status') == 1 else None
        except requests.exceptions.RequestException as e:
            print(f"Error fetching product: {e}")
            return None
    
    def display_product_choices(self, products):
        """Display search results and let user choose"""
        if not products:
            print("No products found.")
            return None
        
        print("\nSearch results:")
        for i, product in enumerate(products[:5], 1):
            product_name = product.get('product_name', 'Unknown Product')
            brand = product.get('brands', 'Unknown Brand')
            print(f"{i}. {product_name} - {brand}")
        
        while True:
            try:
                choice = input("\nSelect a product (1-5) or 0 to search again: ")
                choice_num = int(choice)
                if choice_num == 0:
                    return None
                if 1 <= choice_num <= min(5, len(products)):
                    return products[choice_num - 1]
                else:
                    print("Please enter a valid number.")
            except ValueError:
                print("Please enter a number.")
    
    def get_nutrition_info(self, product):
        """Extract nutrition information from product data"""
        if not product:
            return None
        
        nutrition = product.get('nutriments', {})
        
        # Get basic product info
        product_info = {
            'name': product.get('product_name', 'Unknown'),
            'brand': product.get('brands', 'Unknown'),
            'barcode': product.get('code', 'Unknown')
        }
        
        # Get nutritional values (per 100g/ml)
        nutrition_info = {
            'energy_100g': nutrition.get('energy-kcal_100g') or nutrition.get('energy_100g'),
            'fat_100g': nutrition.get('fat_100g'),
            'saturated_fat_100g': nutrition.get('saturated-fat_100g'),
            'carbohydrates_100g': nutrition.get('carbohydrates_100g'),
            'sugars_100g': nutrition.get('sugars_100g'),
            'protein_100g': nutrition.get('proteins_100g'),
            'fiber_100g': nutrition.get('fiber_100g'),
            'salt_100g': nutrition.get('salt_100g'),
            'sodium_100g': nutrition.get('sodium_100g')
        }
        
        return {**product_info, **nutrition_info}
    
    def format_nutrition_value(self, value):
        """Format nutrition values for display"""
        if value is None:
            return "N/A"
        try:
            return f"{float(value):.1f}"
        except (ValueError, TypeError):
            return "N/A"
    
    def compare_products(self, product1_info, product2_info):
        """Compare two products and display the results"""
        if not product1_info or not product2_info:
            print("Cannot compare - missing product information.")
            return
        
        print("\n" + "="*80)
        print("NUTRITION COMPARISON")
        print("="*80)
        
        headers = ["Nutrient (per 100g/ml)", f"{product1_info['name'][:30]}", f"{product2_info['name'][:30]}", "Difference"]
        print(f"{headers[0]:<25} {headers[1]:<35} {headers[2]:<35} {headers[3]:<15}")
        print("-" * 110)
        
        nutrients = [
            ('Energy (kcal)', 'energy_100g'),
            ('Fat (g)', 'fat_100g'),
            ('Saturated Fat (g)', 'saturated_fat_100g'),
            ('Carbohydrates (g)', 'carbohydrates_100g'),
            ('Sugars (g)', 'sugars_100g'),
            ('Protein (g)', 'protein_100g'),
            ('Fiber (g)', 'fiber_100g'),
            ('Salt (g)', 'salt_100g')
        ]
        
        for nutrient_name, nutrient_key in nutrients:
            val1 = product1_info.get(nutrient_key)
            val2 = product2_info.get(nutrient_key)
            
            if val1 is not None and val2 is not None:
                try:
                    diff = float(val2) - float(val1)
                    diff_str = f"{diff:+.1f}"
                except (ValueError, TypeError):
                    diff_str = "N/A"
            else:
                diff_str = "N/A"
            
            print(f"{nutrient_name:<25} {self.format_nutrition_value(val1):<35} {self.format_nutrition_value(val2):<35} {diff_str:<15}")
    
    def get_product_input(self, product_number):
        """Get a product from user input"""
        print(f"\n=== PRODUCT {product_number} ===")
        
        while True:
            print("\nChoose input method:")
            print("1. Search by product name")
            print("2. Enter barcode")
            print("3. Go back")
            
            choice = input("Enter your choice (1-3): ").strip()
            
            if choice == '1':
                query = input("Enter product name to search: ").strip()
                if not query:
                    print("Please enter a product name.")
                    continue
                
                products = self.search_products(query)
                selected_product = self.display_product_choices(products)
                if selected_product:
                    return self.get_nutrition_info(selected_product)
            
            elif choice == '2':
                barcode = input("Enter barcode: ").strip()
                if not barcode:
                    print("Please enter a barcode.")
                    continue
                
                product = self.get_product_by_barcode(barcode)
                if product:
                    return self.get_nutrition_info(product)
                else:
                    print("Product not found. Please try again.")
            
            elif choice == '3':
                return None
            else:
                print("Invalid choice. Please enter 1, 2, or 3.")

def main():
    comparator = ProductComparator()
    
    print("=== OPEN FOOD FACTS PRODUCT COMPARATOR ===")
    print("Compare nutritional information of two food products")
    
    while True:
        product1_info = comparator.get_product_input(1)
        if product1_info is None:
            continue
        
        product2_info = comparator.get_product_input(2)
        if product2_info is None:
            continue
        
        # Display comparison
        comparator.compare_products(product1_info, product2_info)
        
        # Ask if user wants to continue
        while True:
            again = input("\nCompare more products? (y/n): ").strip().lower()
            if again in ['y', 'yes']:
                break
            elif again in ['n', 'no']:
                print("Thank you for using the Product Comparator!")
                return
            else:
                print("Please enter 'y' or 'n'.")

if __name__ == "__main__":
    main()
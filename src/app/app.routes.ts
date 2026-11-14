import { Routes } from '@angular/router';
import { CookMode } from './cook-mode/cook-mode';
import { RecipeList } from './recipe-list/recipe-list';
import { RecipePage } from './recipes/recipe-page/recipe-page';
import { recipeResolver } from './recipes/recipe.resolver';

export const routes: Routes = [
  { path: '', component: RecipeList, title: 'Family Meal' },
  { path: 'recipes/:slug', component: RecipePage, resolve: { recipe: recipeResolver } },
  { path: 'recipes/:slug/cook', component: CookMode, resolve: { recipe: recipeResolver } },
  { path: '**', redirectTo: '' },
];

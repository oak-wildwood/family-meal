import { Routes } from '@angular/router';
import { RecipeList } from './recipe-list/recipe-list';
import { RecipePage } from './recipes/recipe-page/recipe-page';
import { recipeResolver } from './recipes/recipe.resolver';

export const routes: Routes = [
  { path: '', component: RecipeList, title: 'Family Meal' },
  { path: 'recipes/:slug', component: RecipePage, resolve: { recipe: recipeResolver } },
  { path: '**', redirectTo: '' },
];
